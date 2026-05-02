---
read_when:
    - Ви хочете встановити плагіни Gateway чи сумісні пакети або керувати ними
    - Ви хочете діагностувати збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідка CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-02T17:02:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: a067e6a42eb71e5795b881b6cef45281144a695800b6a33f0669a60ec493d893
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте Plugin для Gateway, пакетами хуків і сумісними бандлами.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів щодо встановлення, увімкнення та усунення несправностей plugins.
  </Card>
  <Card title="Бандли Plugin" href="/uk/plugins/bundles">
    Модель сумісності бандлів.
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
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує часові показники фаз
у stderr і зберігає JSON-вивід придатним для парсингу. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
Вбудовані plugins постачаються з OpenClaw. Деякі ввімкнені за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані мовленнєві провайдери та вбудований браузерний Plugin); інші потребують `plugins enable`.

Нативні plugins OpenClaw повинні постачати `openclaw.plugin.json` з вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні бандли натомість використовують власні маніфести бандлів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип бандла (`codex`, `claude` або `cursor`) та виявлені можливості бандла.
</Note>

### Встановлення

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # ClawHub first, then npm
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
Голі назви пакетів спершу перевіряються в ClawHub, а потім у npm. Ставтеся до встановлення plugins як до запуску коду. Надавайте перевагу закріпленим версіям.
</Warning>

`plugins search` опитує ClawHub щодо доступних для встановлення пакетів Plugin і друкує
готові до встановлення назви пакетів. Він шукає пакети code-plugin і bundle-plugin,
а не skills. Використовуйте `openclaw skills search` для Skills ClawHub.

<Note>
ClawHub є основною поверхнею розповсюдження та виявлення для більшості plugins. Npm
залишається підтримуваним резервним варіантом і шляхом прямого встановлення. Під час міграції до
ClawHub OpenClaw усе ще постачає деякі належні OpenClaw пакети Plugin `@openclaw/*`
у npm; ці версії пакетів можуть відставати від вбудованого джерела між циклами випуску Plugin.
Якщо npm повідомляє, що належний OpenClaw пакет Plugin застарілий, ця
опублікована версія є старим зовнішнім артефактом; використовуйте Plugin, вбудований у
поточний OpenClaw, або локальний checkout, доки не буде опубліковано новіший npm-пакет.
</Note>

<AccordionGroup>
  <Accordion title="Включення конфігурації та відновлення після недійсної конфігурації">
    Якщо ваш розділ `plugins` спирається на однофайловий `$include`, `plugins install/update/enable/disable/uninstall` записує зміни в цей включений файл і залишає `openclaw.json` незмінним. Кореневі включення, масиви включень і включення з сусідніми перевизначеннями завершуються закрито замість сплощення. Див. [Включення конфігурації](/uk/gateway/configuration) щодо підтримуваних форм.

    Якщо під час встановлення конфігурація недійсна, `plugins install` зазвичай завершується закрито й пропонує спершу запустити `openclaw doctor --fix`. Під час запуску Gateway недійсна конфігурація для одного Plugin ізолюється до цього Plugin, щоб інші канали й plugins могли продовжувати роботу; `openclaw doctor --fix` може помістити недійсний запис Plugin у карантин. Єдиний задокументований виняток під час встановлення - вузький шлях відновлення вбудованого Plugin для plugins, які явно погоджуються на `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і перевстановлення порівняно з оновленням">
    `--force` повторно використовує наявну ціль встановлення й перезаписує вже встановлений Plugin або пакет хуків на місці. Використовуйте його, коли ви навмисно перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm Plugin надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id Plugin, який уже встановлено, OpenClaw зупиняється й вказує на `plugins update <id-or-npm-spec>` для звичайного оновлення або на `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з встановленнями `git:`; використовуйте явне git-посилання, наприклад `git:github.com/acme/plugin@v1.2.3`, коли вам потрібне закріплене джерело. Він не підтримується з `--marketplace`, оскільки marketplace-встановлення зберігають метадані джерела marketplace замість npm-специфікації.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` - це аварійний варіант для хибних спрацьовувань у вбудованому сканері небезпечного коду. Він дозволяє продовжити встановлення навіть тоді, коли вбудований сканер повідомляє про знахідки `critical`, але він **не** обходить блокування політик хуків Plugin `before_install` і **не** обходить помилки сканування.

    Цей прапорець CLI застосовується до потоків встановлення/оновлення Plugin. Встановлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills ClawHub.

    Якщо Plugin, який ви опублікували в ClawHub, заблоковано скануванням реєстру, скористайтеся кроками для видавця в [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Пакети хуків і npm-специфікації">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які експонують `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для фільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакетів.

    Npm-специфікації є **лише реєстровими** (назва пакета + необов'язкова **точна версія** або **dist-tag**). Специфікації Git/URL/file та semver-діапазони відхиляються. Встановлення залежностей виконуються локально в межах проєкту з `--ignore-scripts` для безпеки, навіть якщо ваша оболонка має глобальні налаштування встановлення npm.

    Використовуйте `npm:<package>`, коли хочете пропустити пошук у ClawHub і встановити напряму з npm. Голі специфікації пакетів усе одно надають перевагу ClawHub і переходять до npm лише тоді, коли ClawHub не має цього пакета або версії.

    Голі специфікації та `@latest` залишаються на стабільному треку. Якщо npm розв'язує будь-яке з них у попередній випуск, OpenClaw зупиняється й просить явно погодитися за допомогою тегу попереднього випуску, наприклад `@beta`/`@rc`, або точної версії попереднього випуску, наприклад `@1.2.3-beta.4`.

    Якщо гола специфікація встановлення збігається з офіційним id Plugin (наприклад, `diffs`), OpenClaw встановлює запис каталогу напряму. Щоб встановити npm-пакет із такою самою назвою, використовуйте явну scoped-специфікацію (наприклад, `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-репозиторії">
    Використовуйте `git:<repo>` для встановлення напряму з git-репозиторію. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні URL клонування `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб перед встановленням перейти на гілку, тег або коміт.

    Git-встановлення клонуються в тимчасовий каталог, переходять на запитане посилання, якщо воно задане, а потім використовують звичайний інсталятор каталогу Plugin. Це означає, що валідація маніфесту, сканування небезпечного коду, робота встановлення менеджера пакетів і записи встановлення поводяться як npm-встановлення. Записані git-встановлення містять URL/посилання джерела та розв'язаний коміт, щоб `openclaw plugins update` міг пізніше повторно розв'язати джерело.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити реєстрації runtime, такі як методи gateway і команди CLI. Якщо Plugin зареєстрував корінь CLI через `api.registerCli`, виконайте цю команду напряму через кореневий CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних Plugin OpenClaw повинні містити дійсний `openclaw.plugin.json` у корені розпакованого Plugin; архіви, що містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Встановлення з Claude marketplace також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення ClawHub використовують явний locator `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw тепер також надає перевагу ClawHub для голих npm-безпечних специфікацій Plugin. Він переходить до npm лише тоді, коли ClawHub не має цього пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб примусово застосувати лише npm-розв'язання, наприклад коли ClawHub недоступний або ви знаєте, що пакет існує лише в npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перевіряє оголошену сумісність API Plugin / мінімальну сумісність gateway перед встановленням. Коли вибрана версія ClawHub публікує артефакт ClawPack, OpenClaw завантажує версійний npm-pack `.tgz`, перевіряє заголовок digest ClawHub і digest артефакту, а потім встановлює його через звичайний архівний шлях. Старіші версії ClawHub без метаданих ClawPack усе ще встановлюються через застарілий шлях перевірки архіву пакета. Записані встановлення зберігають свої метадані джерела ClawHub і факти digest ClawPack для подальших оновлень.
Неверсійні встановлення ClawHub зберігають неверсійну записану специфікацію, щоб `openclaw plugins update` міг стежити за новішими випусками ClawHub; явні селектори версії або тегу, такі як `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються закріпленими за цим селектором.

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
  <Tab title="Джерела Marketplace">
    - назва відомого marketplace Claude з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь marketplace або шлях до `marketplace.json`
    - скорочення GitHub repo, як-от `owner/repo`
    - URL GitHub repo, як-от `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Правила віддаленого marketplace">
    Для віддалених marketplace, завантажених із GitHub або git, записи Plugin мають залишатися всередині клонованого marketplace repo. OpenClaw приймає джерела відносних шляхів із цього repo та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші не-шляхові джерела Plugin з віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні plugins OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex bundles (`.codex-plugin/plugin.json`)
- сумісні з Claude bundles (`.claude-plugin/plugin.json` або стандартний макет компонентів Claude)
- сумісні з Cursor bundles (`.cursor-plugin/plugin.json`)

<Note>
Сумісні bundles встановлюються у звичайний корінь Plugin і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються bundle skills, command-skills Claude, стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` / оголошені в маніфесті `lspServers`, command-skills Cursor і сумісні каталоги hook Codex; інші виявлені можливості bundle показуються в diagnostics/info, але ще не підключені до виконання в runtime.
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
  Перемкнутися з табличного подання на рядки деталей для кожного Plugin із метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машинозчитуваний інвентар плюс діагностика registry.
</ParamField>

<Note>
`plugins list` спершу читає збережений локальний registry Plugin, із резервним варіантом, виведеним лише з маніфесту, коли registry відсутній або недійсний. Це корисно для перевірки, чи Plugin встановлено, увімкнено та видно для планування холодного запуску, але це не live-перевірка runtime уже запущеного процесу Gateway. Після зміни коду Plugin, увімкнення, політики hook або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати виконання нового коду `register(api)` або hooks. Для віддалених/container розгортань перевірте, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише wrapper-процес.
</Note>

`plugins search` — це віддалений пошук у каталозі ClawHub. Він не перевіряє локальний
стан, не змінює config, не встановлює packages і не завантажує runtime-код Plugin. Результати пошуку
містять назву package ClawHub, family, channel, version, summary та
підказку для встановлення, як-от `openclaw plugins install clawhub:<package>`.

Для роботи з bundled Plugin всередині запакованого Docker image змонтуйте вихідний
каталог Plugin поверх відповідного запакованого source path, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить цей змонтований source
overlay перед `/app/dist/extensions/synology-chat`; звичайний скопійований source
directory лишається неактивним, тож нормальні packaged installs і далі використовують compiled dist.

Для debugging runtime hook:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані hooks і diagnostics із проходу inspection із завантаженим module. Runtime inspection ніколи не встановлює dependencies; використовуйте `openclaw doctor --fix`, щоб очистити legacy dependency state або встановити відсутні налаштовані downloadable plugins.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки service/process, config path і RPC health.
- Non-bundled conversation hooks (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб не копіювати локальний directory (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, бо linked installs повторно використовують source path замість копіювання поверх керованої install target.

Використовуйте `--pin` для npm installs, щоб зберегти resolved exact spec (`name@version`) у managed plugin index, залишаючи стандартну поведінку unpinned.
</Note>

### Індекс Plugin

Метадані встановлення Plugin — це machine-managed state, а не user config. Installs і updates записують їх до `plugins/installs.json` в активному state directory OpenClaw. Його top-level map `installRecords` є довговічним джерелом install metadata, включно із записами для зламаних або відсутніх маніфестів Plugin. Масив `plugins` — це manifest-derived cold registry cache. Файл містить попередження do-not-edit і використовується `openclaw plugins update`, uninstall, diagnostics і cold plugin registry.

Коли OpenClaw бачить shipped legacy записи `plugins.installs` у config, він переміщує їх до plugin index і видаляє config key; якщо будь-який запис не вдається, config records зберігаються, щоб install metadata не було втрачено.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи Plugin з `plugins.entries`, збереженого plugin index, записів allow/deny list Plugin і пов’язаних записів `plugins.load.paths`, коли застосовно. Якщо `--keep-files` не задано, uninstall також видаляє відстежуваний managed install directory, коли він розташований усередині кореня plugin extensions OpenClaw. Для plugins active memory memory slot скидається до `memory-core`.

<Note>
`--keep-config` підтримується як застарілий alias для `--keep-files`.
</Note>

### Оновлення

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Updates застосовуються до відстежуваних installs Plugin у managed plugin index і відстежуваних hook-pack installs у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Розв’язання Plugin id проти npm spec">
    Коли ви передаєте Plugin id, OpenClaw повторно використовує записаний install spec для цього Plugin. Це означає, що раніше збережені dist-tags, як-от `@beta`, і точні pinned versions і далі використовуються під час наступних запусків `update <id>`.

    Для npm installs ви також можете передати явний npm package spec із dist-tag або exact version. OpenClaw зіставляє назву package назад із відстежуваним записом Plugin, оновлює цей встановлений Plugin і записує новий npm spec для майбутніх id-based updates.

    Передавання назви npm package без version або tag також зіставляється назад із відстежуваним записом Plugin. Використовуйте це, коли Plugin було pinned до exact version і ви хочете повернути його до default release line registry.

  </Accordion>
  <Accordion title="Перевірки версії та integrity drift">
    Перед live npm update OpenClaw перевіряє встановлену version package щодо metadata npm registry. Якщо installed version і записана artifact identity вже відповідають resolved target, update пропускається без downloading, reinstalling або переписування `openclaw.json`.

    Коли збережений integrity hash існує, а hash отриманого artifact змінюється, OpenClaw трактує це як npm artifact drift. Інтерактивна команда `openclaw plugins update` друкує expected і actual hashes та просить підтвердження перед продовженням. Non-interactive update helpers fail closed, якщо caller не надає explicit continuation policy.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час update">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як break-glass override для false positives вбудованого dangerous-code scan під час updates Plugin. Він усе одно не обходить policy blocks Plugin `before_install` або блокування scan-failure, і застосовується лише до updates Plugin, а не hook-pack updates.
  </Accordion>
</AccordionGroup>

### Перевірка

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect показує identity, load status, source, manifest capabilities, policy flags, diagnostics, install metadata, bundle capabilities і будь-яку виявлену підтримку MCP або LSP server без імпорту runtime Plugin за замовчуванням. Додайте `--runtime`, щоб завантажити module Plugin і включити зареєстровані hooks, tools, commands, services, gateway methods і HTTP routes. Runtime inspection повідомляє про відсутні dependencies Plugin напряму; installs і repairs залишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

CLI commands, власником яких є Plugin, встановлюються як кореневі command groups `openclaw`. Після того як `inspect --runtime` покаже command у `cliCommands`, запускайте її як `openclaw <command> ...`; наприклад, Plugin, що реєструє `demo-git`, можна перевірити за допомогою `openclaw demo-git ping`.

Кожен Plugin класифікується за тим, що він фактично реєструє під час runtime:

- **plain-capability** — один тип capability (наприклад, provider-only plugin)
- **hybrid-capability** — кілька типів capability (наприклад, text + speech + images)
- **hook-only** — лише hooks, без capabilities або surfaces
- **non-capability** — tools/commands/services, але без capabilities

Дивіться [Форми Plugin](/uk/plugins/architecture#plugin-shapes), щоб дізнатися більше про capability model.

<Note>
Прапорець `--json` виводить machine-readable report, придатний для scripting і auditing. `inspect --all` рендерить fleet-wide table зі shape, capability kinds, compatibility notices, bundle capabilities і summary columns hook. `info` є alias для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про plugin load errors, manifest/discovery diagnostics і compatibility notices. Коли все чисто, він друкує `No plugin issues detected.`

Для module-shape failures, як-от відсутні exports `register`/`activate`, запустіть повторно з `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити compact export-shape summary у diagnostic output.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний plugin registry — це збережена OpenClaw cold read model для installed plugin identity, enablement, source metadata і contribution ownership. Звичайний startup, provider owner lookup, channel setup classification і plugin inventory можуть читати його без імпорту runtime modules Plugin.

Використовуйте `plugins registry`, щоб перевірити, чи збережений registry присутній, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого plugin index, config policy і manifest/package metadata. Це repair path, а не runtime activation path.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий break-glass compatibility switch для registry read failures. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; env fallback призначений лише для emergency startup recovery, поки розгортається migration.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list приймає локальний marketplace path, шлях до `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL GitHub repo або git URL. `--json` друкує resolved source label плюс parsed marketplace manifest і entries Plugin.

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Community plugins](/uk/plugins/community)
