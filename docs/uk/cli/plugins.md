---
read_when:
    - Ви хочете встановити або керувати плагінами Gateway чи сумісними пакетами
    - Ви хочете налагодити збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (список, встановлення, маркетплейс, видалення, увімкнення/вимкнення, doctor)
title: Плагіни
x-i18n:
    generated_at: "2026-05-04T08:21:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3f0ac9412e24f3598e9bab6389f770b3d0d26268d9907891697919d9371f1c1
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте Gateway plugins, наборами хуків і сумісними пакетами.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів щодо встановлення, увімкнення й усунення несправностей plugins.
  </Card>
  <Card title="Manage plugins" href="/uk/plugins/manage-plugins">
    Короткі приклади для встановлення, перегляду списку, оновлення, видалення й публікації.
  </Card>
  <Card title="Plugin bundles" href="/uk/plugins/bundles">
    Модель сумісності пакетів.
  </Card>
  <Card title="Plugin manifest" href="/uk/plugins/manifest">
    Поля маніфесту й схема конфігурації.
  </Card>
  <Card title="Security" href="/uk/gateway/security">
    Посилення безпеки для встановлення plugin.
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
у stderr і зберігає JSON-вивід придатним для парсингу. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
Вбудовані plugins постачаються з OpenClaw. Деякі ввімкнені за замовчуванням (наприклад, вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований браузерний plugin); інші потребують `plugins enable`.

Нативні OpenClaw plugins мають постачати `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні пакети натомість використовують власні маніфести пакетів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип пакета (`codex`, `claude` або `cursor`) та виявлені можливості пакета.
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
Голі назви пакетів під час переходу після запуску за замовчуванням встановлюються з npm. Використовуйте `clawhub:<package>` для ClawHub. Ставтеся до встановлення plugin як до запуску коду. Надавайте перевагу закріпленим версіям.
</Warning>

`plugins search` запитує ClawHub щодо доступних для встановлення пакетів plugin і виводить
назви пакетів, готові до встановлення. Він шукає пакети code-plugin і bundle-plugin,
а не skills. Використовуйте `openclaw skills search` для ClawHub skills.

<Note>
ClawHub є основною поверхнею поширення й виявлення для більшості plugins. Npm
залишається підтримуваним резервним і прямим шляхом встановлення. Пакети plugin
`@openclaw/*`, що належать OpenClaw, знову публікуються в npm; див. поточний список
на [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) або в
[інвентарі plugin](/uk/plugins/plugin-inventory). Стабільні встановлення використовують `latest`.
Встановлення й оновлення бета-каналу надають перевагу npm dist-tag `beta`, коли цей тег
доступний, а потім повертаються до `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Якщо ваш розділ `plugins` підтримується однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують зміни в цей включений файл і залишають `openclaw.json` без змін. Кореневі include, масиви include та include із сусідніми перевизначеннями завершуються закрито замість сплющування. Див. [Config includes](/uk/gateway/configuration) щодо підтримуваних форм.

    Якщо під час встановлення конфігурація недійсна, `plugins install` зазвичай завершується закрито й повідомляє, що спершу потрібно виконати `openclaw doctor --fix`. Під час запуску Gateway і гарячого перезавантаження недійсна конфігурація plugin завершується закрито, як і будь-яка інша недійсна конфігурація; `openclaw doctor --fix` може помістити недійсний запис plugin у карантин. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення вбудованого plugin для plugins, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` повторно використовує наявну ціль встановлення й перезаписує вже встановлений plugin або набір хуків на місці. Використовуйте це, коли навмисно перевстановлюєте той самий id із нового локального шляху, архіву, пакета ClawHub або артефакта npm. Для звичайних оновлень уже відстежуваного npm plugin надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id plugin, який уже встановлено, OpenClaw зупиняється й спрямовує вас до `plugins update <id-or-npm-spec>` для звичайного оновлення або до `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з установленнями `git:`; використовуйте явний git ref, наприклад `git:github.com/acme/plugin@v1.2.3`, коли потрібне закріплене джерело. Він не підтримується з `--marketplace`, бо встановлення marketplace зберігають метадані джерела marketplace замість npm spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійна опція для хибнопозитивних спрацьовувань у вбудованому сканері небезпечного коду. Вона дозволяє продовжити встановлення навіть тоді, коли вбудований сканер повідомляє про знахідки `critical`, але **не** обходить блокування політики хуків plugin `before_install` і **не** обходить збої сканування.

    Цей прапорець CLI застосовується до потоків встановлення/оновлення plugin. Встановлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

    Якщо plugin, який ви опублікували в ClawHub, заблоковано скануванням реєстру, скористайтеся кроками для видавця в [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` також є поверхнею встановлення для наборів хуків, які надають `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для фільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакета.

    Npm specs є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Git/URL/file specs і діапазони semver відхиляються. Встановлення залежностей виконуються локально для проєкту з `--ignore-scripts` для безпеки, навіть якщо у вашій оболонці налаштовані глобальні параметри встановлення npm.

    Використовуйте `npm:<package>`, коли хочете зробити розв’язання npm явним. Голі package specs також встановлюються безпосередньо з npm під час переходу після запуску.

    Голі specs і `@latest` залишаються на стабільному каналі. Датовані корекційні версії OpenClaw, такі як `2026.5.3-1`, є стабільними релізами для цієї перевірки. Якщо npm розв’язує будь-який із них у prerelease, OpenClaw зупиняється й просить явно погодитися за допомогою prerelease-тега, такого як `@beta`/`@rc`, або точної prerelease-версії, наприклад `@1.2.3-beta.4`.

    Якщо голий install spec збігається з офіційним id plugin (наприклад `diffs`), OpenClaw встановлює запис каталогу напряму. Щоб встановити пакет npm із такою самою назвою, використовуйте явний scoped spec (наприклад `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Використовуйте `git:<repo>`, щоб встановити безпосередньо з git-репозиторію. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні URL клонування `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб перед встановленням перейти на гілку, тег або коміт.

    Git-встановлення клонують у тимчасовий каталог, переходять на запитаний ref, якщо він є, а потім використовують звичайний інсталятор каталогу plugin. Це означає, що перевірка маніфесту, сканування небезпечного коду, робота встановлення через менеджер пакетів і записи встановлення поводяться як npm-встановлення. Записані git-встановлення містять URL/ref джерела та розв’язаний коміт, щоб `openclaw plugins update` міг пізніше повторно розв’язати джерело.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити runtime-реєстрації, як-от методи gateway і команди CLI. Якщо plugin зареєстрував корінь CLI через `api.registerCli`, виконайте цю команду напряму через кореневий CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних OpenClaw plugin мають містити дійсний `openclaw.plugin.json` у корені витягнутого plugin; архіви, що містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Встановлення Claude marketplace також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Голі npm-safe specs plugin під час переходу після запуску за замовчуванням встановлюються з npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб зробити розв’язання лише через npm явним:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перед установленням перевіряє заявлену сумісність plugin API / мінімального gateway. Коли вибрана версія ClawHub публікує артефакт ClawPack, OpenClaw завантажує версійний npm-pack `.tgz`, перевіряє digest-заголовок ClawHub і digest артефакта, а потім встановлює його через звичайний шлях архіву. Старіші версії ClawHub без метаданих ClawPack усе ще встановлюються через застарілий шлях перевірки архіву пакета. Записані встановлення зберігають свої метадані джерела ClawHub, тип артефакта, npm integrity, npm shasum, назву tarball і факти digest ClawPack для подальших оновлень.
Неверсійовані встановлення ClawHub зберігають неверсійований записаний spec, щоб `openclaw plugins update` міг відстежувати новіші релізи ClawHub; явні селектори версії або тега, такі як `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються закріпленими на цьому селекторі.

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
  <Tab title="Джерела marketplace">
    - назва відомого marketplace Claude з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь marketplace або шлях `marketplace.json`
    - скорочення репозиторію GitHub, наприклад `owner/repo`
    - URL репозиторію GitHub, наприклад `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Правила віддаленого marketplace">
    Для віддалених marketplace, завантажених із GitHub або git, записи Plugin мають залишатися всередині клонованого репозиторію marketplace. OpenClaw приймає джерела відносних шляхів із цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші непутеві джерела Plugin із віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні plugins OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex пакети (`.codex-plugin/plugin.json`)
- сумісні з Claude пакети (`.claude-plugin/plugin.json` або стандартний макет компонентів Claude)
- сумісні з Cursor пакети (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети встановлюються у звичайний корінь plugins і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються Skills пакета, command-skills Claude, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / оголошених у маніфесті `lspServers`, command-skills Cursor і сумісні каталоги hook Codex; інші виявлені можливості пакетів показуються в діагностиці/info, але ще не підключені до виконання в runtime.
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
  Показувати лише ввімкнені plugins.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Перемкнутися з табличного подання на рядки деталей для кожного Plugin з метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитаний інвентар, а також діагностика registry і стан установлення залежностей пакета.
</ParamField>

<Note>
`plugins list` спочатку читає збережений локальний registry plugins, із резервним варіантом на основі лише маніфесту, коли registry відсутній або недійсний. Це корисно для перевірки, чи Plugin встановлений, увімкнений і видимий для планування холодного запуску, але це не живий runtime-зонд уже запущеного процесу Gateway. Після зміни коду Plugin, увімкнення, політики hook або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуск нового коду `register(api)` або hooks. Для віддалених/container розгортань перевірте, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

`plugins list --json` містить `dependencyStatus` кожного Plugin з `package.json`
`dependencies` і `optionalDependencies`. OpenClaw перевіряє, чи ці назви пакетів
присутні вздовж звичайного шляху пошуку Node `node_modules` для Plugin; він
не імпортує runtime-код Plugin, не запускає менеджер пакетів і не виправляє
відсутні залежності.
</Note>

`plugins search` — це віддалений пошук у каталозі ClawHub. Він не перевіряє локальний
стан, не змінює config, не встановлює пакети й не завантажує runtime-код Plugin. Результати
пошуку містять назву пакета ClawHub, сімейство, канал, версію, підсумок і
підказку встановлення, наприклад `openclaw plugins install clawhub:<package>`.

Для роботи з комплектним Plugin усередині packaged Docker image змонтуйте каталог
джерела Plugin поверх відповідного packaged source path, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить це змонтоване source
overlay перед `/app/dist/extensions/synology-chat`; звичайний скопійований source
directory залишається інертним, тож звичайні packaged installs і далі використовують скомпільований dist.

Для налагодження runtime hook:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані hooks і діагностику з проходу перевірки із завантаженням модуля. Runtime-перевірка ніколи не встановлює залежності; використовуйте `openclaw doctor --fix`, щоб очистити legacy dependency state або встановити відсутні налаштовані downloadable plugins.
- `openclaw gateway status --deep --require-rpc` підтверджує досяжний Gateway, підказки service/process, шлях config і справність RPC.
- Некомплектні conversation hooks (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб не копіювати локальний каталог (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, оскільки linked installs повторно використовують source path замість копіювання поверх керованої install target.

Використовуйте `--pin` під час npm installs, щоб зберегти resolved exact spec (`name@version`) у керованому індексі Plugin, залишаючи типову поведінку без фіксації.
</Note>

### Індекс Plugin

Метадані встановлення Plugin — це керований машиною стан, а не user config. Встановлення й оновлення записують його до `plugins/installs.json` в активному каталозі стану OpenClaw. Його map верхнього рівня `installRecords` є довготривалим джерелом метаданих встановлення, включно із записами для пошкоджених або відсутніх маніфестів Plugin. Масив `plugins` — це похідний від маніфестів кеш cold registry. Файл містить попередження не редагувати й використовується `openclaw plugins update`, uninstall, diagnostics і cold plugin registry.

Коли OpenClaw бачить shipped legacy записи `plugins.installs` у config, він переміщує їх до індексу Plugin і видаляє config key; якщо будь-який запис не вдається, config records зберігаються, щоб метадані встановлення не були втрачені.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи Plugin з `plugins.entries`, збереженого індексу Plugin, записів списку allow/deny для Plugin і linked записів `plugins.load.paths`, коли це застосовно. Якщо `--keep-files` не встановлено, uninstall також видаляє відстежуваний керований install directory, коли він розташований усередині кореня plugin extensions OpenClaw. Для plugins active memory слот memory скидається до `memory-core`.

<Note>
`--keep-config` підтримується як застарілий alias для `--keep-files`.
</Note>

### Оновлення

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Оновлення застосовуються до відстежуваних installs Plugin у керованому індексі Plugin і відстежуваних installs hook-pack у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Визначення plugin id порівняно з npm spec">
    Коли ви передаєте plugin id, OpenClaw повторно використовує recorded install spec для цього Plugin. Це означає, що раніше збережені dist-tags, як-от `@beta`, і точні pinned versions продовжують використовуватися під час наступних запусків `update <id>`.

    Для npm installs ви також можете передати явний npm package spec з dist-tag або exact version. OpenClaw зіставляє цю назву пакета назад із відстежуваним записом Plugin, оновлює цей встановлений Plugin і записує новий npm spec для майбутніх оновлень на основі id.

    Передавання назви npm package без версії або tag також зіставляється назад із відстежуваним записом Plugin. Використовуйте це, коли Plugin було pinned до точної версії, і ви хочете повернути його до стандартної лінії випусків registry.

  </Accordion>
  <Accordion title="Оновлення beta channel">
    `openclaw plugins update` повторно використовує відстежуваний plugin spec, якщо ви не передасте новий spec. `openclaw update` додатково знає активний OpenClaw update channel: на beta channel записи default-line npm і ClawHub Plugin спочатку пробують `@beta`, а потім повертаються до записаного default/latest spec, якщо beta release Plugin не існує. Exact versions і explicit tags залишаються pinned до цього selector.

  </Accordion>
  <Accordion title="Перевірки версій і drift цілісності">
    Перед живим npm update OpenClaw перевіряє встановлену версію пакета за метаданими npm registry. Якщо встановлена версія та recorded artifact identity уже відповідають resolved target, оновлення пропускається без завантаження, повторного встановлення або перезапису `openclaw.json`.

    Коли існує збережений integrity hash і хеш отриманого artifact змінюється, OpenClaw розглядає це як npm artifact drift. Інтерактивна команда `openclaw plugins update` друкує expected і actual hashes та запитує підтвердження перед продовженням. Non-interactive update helpers завершуються закрито, якщо caller не надає explicit continuation policy.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час update">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як break-glass override для хибнопозитивних результатів built-in dangerous-code scan під час оновлень Plugin. Він усе одно не обходить policy blocks Plugin `before_install` або scan-failure blocking і застосовується лише до оновлень Plugin, а не до оновлень hook-pack.
  </Accordion>
</AccordionGroup>

### Перевірка

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect показує identity, load status, source, можливості manifest, policy flags, diagnostics, install metadata, bundle capabilities і будь-яку виявлену підтримку server MCP або LSP без імпорту runtime Plugin за замовчуванням. Додайте `--runtime`, щоб завантажити модуль Plugin і включити registered hooks, tools, commands, services, gateway methods і HTTP routes. Runtime-перевірка повідомляє про відсутні залежності Plugin напряму; installs і repairs залишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

CLI-команди, якими володіє Plugin, встановлюються як кореневі групи команд `openclaw`. Після того як `inspect --runtime` покаже команду в `cliCommands`, запустіть її як `openclaw <command> ...`; наприклад, Plugin, який реєструє `demo-git`, можна перевірити за допомогою `openclaw demo-git ping`.

Кожен Plugin класифікується за тим, що він фактично реєструє під час runtime:

- **plain-capability** — один тип capability (наприклад, Plugin лише для provider)
- **hybrid-capability** — кілька типів capability (наприклад, text + speech + images)
- **hook-only** — лише hooks, без capabilities або surfaces
- **non-capability** — tools/commands/services, але без capabilities

Див. [Форми Plugin](/uk/plugins/architecture#plugin-shapes), щоб дізнатися більше про модель capability.

<Note>
Прапорець `--json` виводить машиночитаний звіт, придатний для scripting і auditing. `inspect --all` рендерить fleet-wide table зі shape, capability kinds, compatibility notices, bundle capabilities і стовпцями hook summary. `info` — це alias для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження Plugin, діагностику manifest/discovery і compatibility notices. Коли все чисто, він друкує `No plugin issues detected.`

Якщо налаштований Plugin присутній на диску, але заблокований перевірками path-safety у loader, config validation зберігає запис Plugin і повідомляє про нього як `present but blocked`. Виправте попередню blocked-plugin diagnostic, наприклад ownership path або world-writable permissions, замість видалення config `plugins.entries.<id>` або `plugins.allow`.

Для збоїв форми модуля, як-от відсутні exports `register`/`activate`, повторно запустіть з `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактний підсумок export-shape у diagnostic output.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний registry Plugin — це збережена cold read model OpenClaw для identity встановленого Plugin, enablement, source metadata і contribution ownership. Звичайний запуск, provider owner lookup, channel setup classification і plugin inventory можуть читати його без імпорту runtime modules Plugin.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр наявний, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу Plugin, політики конфігурації та метаданих маніфесту/пакета. Це шлях відновлення, а не шлях активації під час виконання.

`openclaw doctor --fix` також виправляє суміжне з реєстром відхилення керованого npm: якщо осиротілий пакет `@openclaw/*` у корені npm керованого Plugin затіняє вбудований Plugin, doctor видаляє цей застарілий пакет і перебудовує реєстр, щоб запуск перевірявся за вбудованим маніфестом.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний варіант через env призначений лише для аварійного відновлення запуску під час розгортання міграції.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список Marketplace приймає локальний шлях Marketplace, шлях `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` виводить мітку розпізнаного джерела разом із розібраним маніфестом Marketplace і записами Plugin.

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Plugin спільноти](/uk/plugins/community)
