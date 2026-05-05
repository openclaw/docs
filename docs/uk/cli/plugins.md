---
read_when:
    - Ви хочете встановити або керувати плагінами Gateway чи сумісними бандлами
    - Ви хочете діагностувати збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (список, встановлення, маркетплейс, видалення, увімкнення/вимкнення, діагностика)
title: Plugins
x-i18n:
    generated_at: "2026-05-05T01:21:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24d274f33213231eaed48ac848a9266802a2179ba0311ab18462ad783219095a
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте Gateway plugins, пакетами hook і сумісними bundles.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення та усунення несправностей plugins.
  </Card>
  <Card title="Керування plugins" href="/uk/plugins/manage-plugins">
    Короткі приклади для встановлення, перегляду списку, оновлення, видалення та публікації.
  </Card>
  <Card title="Plugin bundles" href="/uk/plugins/bundles">
    Модель сумісності bundle.
  </Card>
  <Card title="Plugin manifest" href="/uk/plugins/manifest">
    Поля manifest і схема config.
  </Card>
  <Card title="Безпека" href="/uk/gateway/security">
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

Для дослідження повільного встановлення, інспектування, видалення або оновлення registry запустіть
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace записує фазові таймінги
до stderr і залишає JSON-вивід придатним для парсингу. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
Bundled plugins постачаються разом з OpenClaw. Деякі увімкнені за замовчуванням (наприклад, bundled model providers, bundled speech providers і bundled browser plugin); інші потребують `plugins enable`.

Native OpenClaw plugins мають постачати `openclaw.plugin.json` з inline JSON Schema (`configSchema`, навіть якщо вона порожня). Compatible bundles натомість використовують власні manifests bundle.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Детальний вивід list/info також показує підтип bundle (`codex`, `claude` або `cursor`) і виявлені можливості bundle.
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
Голі назви packages під час launch cutover встановлюються з npm за замовчуванням. Використовуйте `clawhub:<package>` для ClawHub. Ставтеся до встановлення plugin як до запуску коду. Віддавайте перевагу зафіксованим версіям.
</Warning>

`plugins search` надсилає запит до ClawHub щодо доступних для встановлення packages plugin і виводить
готові до встановлення назви packages. Він шукає packages code-plugin і bundle-plugin,
а не skills. Використовуйте `openclaw skills search` для ClawHub skills.

<Note>
ClawHub є основною поверхнею розповсюдження та пошуку для більшості plugins. Npm
залишається підтримуваним fallback і шляхом прямого встановлення. Packages plugin,
що належать OpenClaw, `@openclaw/*` знову публікуються в npm; див. поточний список
на [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) або
[інвентар Plugin](/uk/plugins/plugin-inventory). Стабільні встановлення використовують `latest`.
Встановлення й оновлення beta-channel віддають перевагу npm `beta` dist-tag, коли цей tag
доступний, а потім повертаються до `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes і відновлення invalid-config">
    Якщо ваш розділ `plugins` підтримується однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують зміни в цей включений файл і не змінюють `openclaw.json`. Root includes, масиви include та includes із sibling overrides завершуються закрито замість flattening. Див. [Config includes](/uk/gateway/configuration) щодо підтримуваних форм.

    Якщо config невалідна під час встановлення, `plugins install` зазвичай завершується закрито й просить спочатку запустити `openclaw doctor --fix`. Під час запуску Gateway і hot reload невалідна config plugin завершується закрито, як і будь-яка інша невалідна config; `openclaw doctor --fix` може ізолювати невалідний запис plugin. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення bundled-plugin для plugins, які явно обирають `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і перевстановлення проти оновлення">
    `--force` повторно використовує наявну ціль встановлення й перезаписує вже встановлений plugin або hook pack на місці. Використовуйте це, коли ви навмисно перевстановлюєте той самий id з нового локального шляху, archive, package ClawHub або artifact npm. Для звичайних upgrade вже відстежуваного npm plugin віддавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для вже встановленого id plugin, OpenClaw зупиняється й указує на `plugins update <id-or-npm-spec>` для звичайного upgrade або на `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до npm installs. Він не підтримується з `git:` installs; використовуйте явний git ref, наприклад `git:github.com/acme/plugin@v1.2.3`, коли хочете зафіксоване джерело. Він не підтримується з `--marketplace`, оскільки marketplace installs зберігають metadata джерела marketplace замість npm spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійний варіант для хибних спрацювань у вбудованому сканері небезпечного коду. Він дозволяє встановленню продовжитися, навіть коли вбудований scanner повідомляє про findings рівня `critical`, але він **не** обходить blocks політики hook `before_install` plugin і **не** обходить failures сканування.

    Цей CLI flag застосовується до потоків install/update plugin. Gateway-backed installs залежностей skill використовують відповідний request override `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення skill з ClawHub.

    Якщо plugin, який ви опублікували на ClawHub, заблокований registry scan, скористайтеся кроками publisher у [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Hook packs і npm specs">
    `plugins install` також є поверхнею встановлення для hook packs, які експонують `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для фільтрованої видимості hooks і ввімкнення окремих hooks, а не для встановлення package.

    Npm specs є **лише registry-only** (назва package + необов’язкова **точна версія** або **dist-tag**). Git/URL/file specs і semver ranges відхиляються. Dependency installs виконуються project-local з `--ignore-scripts` для безпеки, навіть коли ваша shell має глобальні налаштування npm install.

    Використовуйте `npm:<package>`, коли хочете зробити npm resolution явним. Голі package specs також встановлюються безпосередньо з npm під час launch cutover.

    Bare specs і `@latest` залишаються на stable track. OpenClaw date-stamped correction versions, як-от `2026.5.3-1`, є stable releases для цієї перевірки. Якщо npm resolve будь-який із них у prerelease, OpenClaw зупиняється й просить вас явно погодитися через prerelease tag, наприклад `@beta`/`@rc`, або точну prerelease version, наприклад `@1.2.3-beta.4`.

    Якщо bare install spec збігається з офіційним id plugin (наприклад `diffs`), OpenClaw встановлює catalog entry безпосередньо. Щоб встановити npm package з такою самою назвою, використовуйте явний scoped spec (наприклад `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Використовуйте `git:<repo>`, щоб встановлювати безпосередньо з git repository. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні clone URLs `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб checkout branch, tag або commit перед встановленням.

    Git installs клонують у тимчасовий directory, checkout requested ref, коли він є, а потім використовують звичайний installer directory plugin. Це означає, що validation manifest, dangerous-code scanning, package-manager install work і install records поводяться як npm installs. Записані git installs включають source URL/ref плюс resolved commit, щоб `openclaw plugins update` міг пізніше повторно resolve джерело.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити runtime registrations, як-от gateway methods і CLI commands. Якщо plugin зареєстрував CLI root через `api.registerCli`, виконайте цю command безпосередньо через root CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Підтримувані archives: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archives native OpenClaw plugin мають містити валідний `openclaw.plugin.json` у extracted plugin root; archives, які містять лише `package.json`, відхиляються до того, як OpenClaw запише install records.

    Claude marketplace installs також підтримуються.

  </Accordion>
</AccordionGroup>

ClawHub installs використовують явний locator `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Bare npm-safe plugin specs під час launch cutover встановлюються з npm за замовчуванням:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб зробити npm-only resolution явним:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перевіряє оголошену сумісність plugin API / minimum gateway перед встановленням. Коли вибрана версія ClawHub публікує artifact ClawPack, OpenClaw завантажує versioned npm-pack `.tgz`, перевіряє digest header ClawHub і artifact digest, а потім встановлює його через звичайний archive path. Старіші версії ClawHub без metadata ClawPack все ще встановлюються через legacy package archive verification path. Записані installs зберігають ClawHub source metadata, artifact kind, npm integrity, npm shasum, tarball name і ClawPack digest facts для подальших оновлень.
Unversioned ClawHub installs зберігають unversioned recorded spec, щоб `openclaw plugins update` міг відстежувати новіші releases ClawHub; explicit version або tag selectors, як-от `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються pinned до цього selector.

#### Скорочення marketplace

Використовуйте скорочення `plugin@marketplace`, коли назва marketplace існує в local registry cache Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

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
    - скорочення репозиторію GitHub, як-от `owner/repo`
    - URL репозиторію GitHub, як-от `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Правила віддаленого маркетплейсу">
    Для віддалених маркетплейсів, завантажених із GitHub або git, записи плагінів мають залишатися всередині клонованого репозиторію маркетплейсу. OpenClaw приймає джерела з відносним шляхом із цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші непутеві джерела плагінів із віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично виявляє:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex пакети (`.codex-plugin/plugin.json`)
- сумісні з Claude пакети (`.claude-plugin/plugin.json` або стандартний макет компонентів Claude)
- сумісні з Cursor пакети (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети встановлюються у звичайний корінь плагінів і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються Skills пакетів, командні Skills Claude, стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` / оголошених у маніфесті `lspServers`, командні Skills Cursor і сумісні каталоги хуків Codex; інші виявлені можливості пакетів показуються в діагностиці/info, але ще не підключені до виконання під час роботи.
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
  Машиночитаний інвентар, а також діагностика реєстру та стан встановлення залежностей пакета.
</ParamField>

<Note>
`plugins list` спочатку читає збережений локальний реєстр плагінів, із запасним варіантом, виведеним лише з маніфесту, коли реєстр відсутній або недійсний. Це корисно для перевірки, чи плагін встановлено, увімкнено та видно для планування холодного запуску, але це не live-зонд середовища виконання для вже запущеного процесу Gateway. Після зміни коду плагіна, увімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або хуків. Для віддалених/контейнерних розгортань перевірте, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

`plugins list --json` включає `dependencyStatus` кожного плагіна з `package.json`
`dependencies` і `optionalDependencies`. OpenClaw перевіряє, чи присутні ці назви пакетів
уздовж звичайного шляху пошуку Node `node_modules` для плагіна; він
не імпортує код виконання плагіна, не запускає менеджер пакетів і не відновлює відсутні
залежності.
</Note>

`plugins search` — це віддалений пошук у каталозі ClawHub. Він не перевіряє локальний
стан, не змінює конфігурацію, не встановлює пакети й не завантажує код виконання плагіна. Результати пошуку
містять назву пакета ClawHub, сімейство, канал, версію, підсумок і
підказку для встановлення, як-от `openclaw plugins install clawhub:<package>`.

Для роботи з вбудованими плагінами всередині запакованого образу Docker змонтуйте через bind-mount каталог
джерела плагіна поверх відповідного запакованого шляху джерела, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить цей змонтований
оверлей джерела перед `/app/dist/extensions/synology-chat`; звичайний скопійований каталог
джерела залишається неактивним, тож звичайні запаковані встановлення все одно використовують скомпільований dist.

Для налагодження хуків під час роботи:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані хуки та діагностику з проходу інспекції із завантаженням модуля. Інспекція під час роботи ніколи не встановлює залежності; використовуйте `openclaw doctor --fix`, щоб очистити застарілий стан залежностей або відновити відсутні завантажувані плагіни, на які посилається конфігурація.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки служби/процесу, шлях конфігурації та справність RPC.
- Невбудовані хуки розмов (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, оскільки пов’язані встановлення повторно використовують шлях джерела замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі плагінів, залишаючи стандартну поведінку незакріпленою.
</Note>

### Індекс Plugin

Метадані встановлення Plugin — це керований машиною стан, а не користувацька конфігурація. Встановлення й оновлення записують його до `plugins/installs.json` в активному каталозі стану OpenClaw. Його мапа верхнього рівня `installRecords` є довговічним джерелом метаданих встановлення, зокрема записів для пошкоджених або відсутніх маніфестів плагінів. Масив `plugins` — це кеш холодного реєстру, виведений із маніфесту. Файл містить попередження не редагувати його та використовується `openclaw plugins update`, видаленням, діагностикою та холодним реєстром плагінів.

Коли OpenClaw бачить доставлені застарілі записи `plugins.installs` у конфігурації, він переміщує їх в індекс плагінів і видаляє ключ конфігурації; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані встановлення не було втрачено.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагіна з `plugins.entries`, збереженого індексу плагінів, записів списків дозволу/заборони плагінів і пов’язаних записів `plugins.load.paths`, коли це застосовно. Якщо не встановлено `--keep-files`, видалення також прибирає відстежуваний керований каталог встановлення, коли він розташований усередині кореня розширень плагінів OpenClaw. Для плагінів active memory слот пам’яті скидається до `memory-core`.

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
    Коли ви передаєте id плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-теги, як-от `@beta`, і точні закріплені версії продовжують використовуватися під час подальших запусків `update <id>`.

    Для npm-встановлень ви також можете передати явну специфікацію npm-пакета з dist-тегом або точною версією. OpenClaw розв’язує цю назву пакета назад до відстежуваного запису плагіна, оновлює цей установлений плагін і записує нову npm-специфікацію для майбутніх оновлень на основі id.

    Передавання назви npm-пакета без версії або тегу також розв’язується назад до відстежуваного запису плагіна. Використовуйте це, коли плагін було закріплено до точної версії, а ви хочете повернути його до стандартної лінії випусків реєстру.

  </Accordion>
  <Accordion title="Оновлення beta-каналу">
    `openclaw plugins update` повторно використовує відстежувану специфікацію плагіна, якщо ви не передаєте нову специфікацію. `openclaw update` додатково знає активний канал оновлень OpenClaw: на beta-каналі записи плагінів npm і ClawHub зі стандартної лінії спершу пробують `@beta`, а потім повертаються до записаної стандартної/latest-специфікації, якщо beta-випуску плагіна не існує. Точні версії та явні теги залишаються закріпленими до цього селектора.

  </Accordion>
  <Accordion title="Перевірки версій і дрейф цілісності">
    Перед live-оновленням npm OpenClaw перевіряє встановлену версію пакета за метаданими реєстру npm. Якщо встановлена версія та записана ідентичність артефакта вже збігаються з розв’язаною ціллю, оновлення пропускається без завантаження, перевстановлення або перезапису `openclaw.json`.

    Коли збережений хеш цілісності існує, а хеш отриманого артефакта змінюється, OpenClaw розглядає це як дрейф артефакта npm. Інтерактивна команда `openclaw plugins update` друкує очікуваний і фактичний хеші та запитує підтвердження перед продовженням. Неінтерактивні помічники оновлення завершуються закрито, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійний override для хибних спрацювань вбудованого сканування небезпечного коду під час оновлень плагінів. Він усе одно не обходить блокування політики `before_install` плагіна або блокування через невдале сканування, і застосовується лише до оновлень плагінів, а не оновлень hook-pack.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect показує ідентичність, стан завантаження, джерело, можливості маніфесту, прапорці політики, діагностику, метадані встановлення, можливості пакета та будь-яку виявлену підтримку серверів MCP або LSP без імпорту коду виконання плагіна за замовчуванням. Додайте `--runtime`, щоб завантажити модуль плагіна та включити зареєстровані хуки, інструменти, команди, служби, методи Gateway і HTTP-маршрути. Інспекція під час роботи напряму повідомляє про відсутні залежності плагіна; встановлення та відновлення залишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

CLI-команди, що належать плагінам, установлюються як кореневі групи команд `openclaw`. Після того як `inspect --runtime` покаже команду в `cliCommands`, запускайте її як `openclaw <command> ...`; наприклад, плагін, який реєструє `demo-git`, можна перевірити за допомогою `openclaw demo-git ping`.

Кожен плагін класифікується за тим, що він фактично реєструє під час роботи:

- **plain-capability** — один тип можливості (наприклад, плагін лише для провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/служби, але без можливостей

Див. [Форми Plugin](/uk/plugins/architecture#plugin-shapes), щоб дізнатися більше про модель можливостей.

<Note>
Прапорець `--json` виводить машиночитаний звіт, придатний для скриптів і аудиту. `inspect --all` рендерить таблицю для всього парку з колонками форми, типів можливостей, повідомлень про сумісність, можливостей пакета та підсумку хуків. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, діагностику маніфесту/виявлення та повідомлення про сумісність. Коли все чисто, він друкує `No plugin issues detected.`

Якщо налаштований плагін присутній на диску, але заблокований перевірками безпеки шляхів завантажувача, перевірка конфігурації зберігає запис плагіна та повідомляє про нього як `present but blocked`. Виправте попередню діагностику заблокованого плагіна, наприклад власника шляху або дозволи world-writable, замість видалення конфігурації `plugins.entries.<id>` або `plugins.allow`.

Для помилок форми модуля, як-от відсутніх експортів `register`/`activate`, повторно запустіть з `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактний підсумок форми експортів у діагностичний вивід.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр плагінів — це збережена холодна модель читання OpenClaw для ідентичності встановлених плагінів, увімкнення, метаданих джерела та власності внесків. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу та інвентар плагінів можуть читати його без імпорту модулів виконання плагінів.

Використовуйте `plugins registry`, щоб перевірити, чи постійний реєстр наявний, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його з постійного індексу Plugin, політики конфігурації та метаданих маніфесту/пакета. Це шлях відновлення, а не шлях активації під час виконання.

`openclaw doctor --fix` також виправляє пов’язане з реєстром відхилення керованого npm: якщо осиротілий або відновлений пакет `@openclaw/*` під коренем npm керованого Plugin затіняє вбудований Plugin, doctor видаляє цей застарілий пакет і перебудовує реєстр, щоб запуск перевірявся за вбудованим маніфестом.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний варіант через env призначений лише для екстреного відновлення запуску, поки міграція розгортається.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список Marketplace приймає локальний шлях Marketplace, шлях `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або URL git. `--json` виводить визначену мітку джерела, а також розібраний маніфест Marketplace і записи Plugin.

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Спільнотні Plugin](/uk/plugins/community)
