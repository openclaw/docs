---
read_when:
    - Ви хочете встановити або керувати Gateway plugins чи сумісними пакетами
    - Ви хочете діагностувати збої під час завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-07T13:15:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73023d11309c5dc4fe9fab9cffc0f7d96de1e1c22ce1ec4d2cd22d2aa4808f1a
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте плагінами Gateway, пакетами хуків і сумісними бандлами.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів щодо встановлення, увімкнення та усунення несправностей плагінів.
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
    Посилення безпеки для встановлення плагінів.
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

Для дослідження повільного встановлення, інспектування, видалення або оновлення реєстру запускайте команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує тривалість фаз у stderr і зберігає JSON-вивід придатним для парсингу. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
У режимі Nix (`OPENCLAW_NIX_MODE=1`) мутаторів життєвого циклу плагінів вимкнено. Для цього встановлення використовуйте джерело Nix замість `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` або `plugins disable`; для nix-openclaw використовуйте орієнтований на агента [Швидкий старт](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Вбудовані плагіни постачаються з OpenClaw. Деякі ввімкнені за замовчуванням (наприклад, вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований браузерний плагін); інші потребують `plugins enable`.

Нативні плагіни OpenClaw повинні постачати `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні бандли натомість використовують власні маніфести бандлів.

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

<Warning>
Під час стартового переходу прості назви пакетів за замовчуванням установлюються з npm. Використовуйте `clawhub:<package>` для ClawHub. Ставтеся до встановлення плагінів як до запуску коду. Надавайте перевагу закріпленим версіям.
</Warning>

`plugins search` надсилає запит до ClawHub щодо пакетів плагінів, доступних для встановлення, і виводить готові до встановлення назви пакетів. Пошук виконується серед пакетів code-plugin і bundle-plugin, а не Skills. Використовуйте `openclaw skills search` для Skills у ClawHub.

<Note>
ClawHub є основною поверхнею розповсюдження та пошуку для більшості плагінів. Npm залишається підтримуваним резервним варіантом і шляхом прямого встановлення. Пакети плагінів `@openclaw/*`, що належать OpenClaw, знову публікуються в npm; див. поточний список на [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) або [інвентар плагінів](/uk/plugins/plugin-inventory). Стабільні встановлення використовують `latest`. Встановлення та оновлення з бета-каналу надають перевагу npm `beta` dist-tag, коли цей тег доступний, а потім повертаються до `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Включення конфігурації та виправлення недійсної конфігурації">
    Якщо ваш розділ `plugins` спирається на однофайловий `$include`, `plugins install/update/enable/disable/uninstall` записують зміни до цього включеного файлу й залишають `openclaw.json` без змін. Кореневі включення, масиви включень і включення із сусідніми перевизначеннями завершуються закрито, а не вирівнюються. Див. [Включення конфігурації](/uk/gateway/configuration) для підтримуваних форм.

    Якщо під час встановлення конфігурація недійсна, `plugins install` зазвичай завершується закрито й повідомляє, що спершу потрібно запустити `openclaw doctor --fix`. Під час запуску Gateway і гарячого перезавантаження недійсна конфігурація плагіна завершується закрито, як і будь-яка інша недійсна конфігурація; `openclaw doctor --fix` може помістити недійсний запис плагіна в карантин. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення вбудованого плагіна для плагінів, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і перевстановлення проти оновлення">
    `--force` повторно використовує наявну ціль встановлення й перезаписує вже встановлений плагін або пакет хуків на місці. Використовуйте його, коли ви навмисно перевстановлюєте той самий id із нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm-плагіна надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо запустити `plugins install` для id плагіна, який уже встановлено, OpenClaw зупиниться й вкаже на `plugins update <id-or-npm-spec>` для звичайного оновлення або на `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з установленнями `git:`; використовуйте явний git ref, як-от `git:github.com/acme/plugin@v1.2.3`, коли потрібне закріплене джерело. Він не підтримується з `--marketplace`, оскільки встановлення з marketplace зберігають метадані джерела marketplace замість npm spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійний параметр для хибних спрацювань у вбудованому сканері небезпечного коду. Він дає змогу продовжити встановлення, навіть коли вбудований сканер повідомляє про знахідки `critical`, але **не** обходить блокування політики хуків `before_install` плагіна й **не** обходить збої сканування.

    Цей прапорець CLI застосовується до потоків install/update для плагінів. Встановлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

    Якщо плагін, який ви опублікували в ClawHub, заблоковано скануванням реєстру, скористайтеся кроками для видавця в [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Пакети хуків і npm specs">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які експортують `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для фільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакетів.

    Npm specs є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Git/URL/file specs і діапазони semver відхиляються. Встановлення залежностей виконується локально для проєкту з `--ignore-scripts` задля безпеки, навіть якщо у вашій оболонці є глобальні налаштування npm install. Керовані корені npm плагінів успадковують npm `overrides` рівня пакета OpenClaw, тож захисні закріплення хоста також застосовуються до піднятих залежностей плагінів.

    Використовуйте `npm:<package>`, коли потрібно явно вказати npm-резолюцію. Під час стартового переходу прості package specs також установлюються безпосередньо з npm.

    Прості specs і `@latest` залишаються на стабільній гілці. Датовані версії виправлень OpenClaw, як-от `2026.5.3-1`, для цієї перевірки є стабільними релізами. Якщо npm резолвить будь-який із них у prerelease, OpenClaw зупиняється й просить явно погодитися за допомогою prerelease-тега, як-от `@beta`/`@rc`, або точної prerelease-версії, як-от `@1.2.3-beta.4`.

    Якщо простий install spec збігається з офіційним id плагіна (наприклад, `diffs`), OpenClaw встановлює запис каталогу напряму. Щоб установити npm-пакет із тією самою назвою, використовуйте явний scoped spec (наприклад, `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-репозиторії">
    Використовуйте `git:<repo>` для встановлення безпосередньо з git-репозиторію. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні URL клонування `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб перед встановленням перейти на гілку, тег або коміт.

    Git-встановлення клонують у тимчасовий каталог, за наявності переходять на запитаний ref, а потім використовують звичайний інсталятор каталогу плагіна. Це означає, що перевірка маніфесту, сканування небезпечного коду, робота встановлення менеджера пакетів і записи встановлення поводяться як npm-встановлення. Записані git-встановлення містять URL/ref джерела плюс розв’язаний коміт, щоб `openclaw plugins update` міг пізніше повторно розв’язати джерело.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити runtime-реєстрації, як-от методи gateway і команди CLI. Якщо плагін зареєстрував корінь CLI через `api.registerCli`, виконайте цю команду напряму через кореневий CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних плагінів OpenClaw повинні містити дійсний `openclaw.plugin.json` у розпакованому корені плагіна; архіви, що містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Використовуйте `npm-pack:<path.tgz>`, коли файл є tarball npm-pack і ви хочете протестувати той самий керований шлях встановлення npm-root, який використовується встановленнями з реєстру, включно з перевіркою `package-lock.json`, скануванням піднятих залежностей і записами npm install. Звичайні шляхи архівів усе ще встановлюються як локальні архіви в корені розширень плагінів.

    Встановлення з Claude marketplace також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення з ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Під час стартового переходу прості npm-безпечні specs плагінів за замовчуванням установлюються з npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб явно вказати резолюцію лише через npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перевіряє оголошену сумісність API Plugin / мінімальну сумісність Gateway перед встановленням. Коли вибрана версія ClawHub публікує артефакт ClawPack, OpenClaw завантажує версійний npm-пакет `.tgz`, перевіряє заголовок дайджесту ClawHub і дайджест артефакту, а потім встановлює його через звичайний шлях архіву. Старіші версії ClawHub без метаданих ClawPack і далі встановлюються через застарілий шлях перевірки архіву пакета. Записані встановлення зберігають метадані джерела ClawHub, тип артефакту, npm integrity, npm shasum, назву tarball і факти дайджесту ClawPack для подальших оновлень.
Неверсійні встановлення ClawHub зберігають неверсійний записаний spec, щоб `openclaw plugins update` міг відстежувати новіші релізи ClawHub; явні селектори версії або тегу, як-от `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються закріпленими за цим селектором.

#### Скорочення Marketplace

Використовуйте скорочення `plugin@marketplace`, коли назва marketplace існує в локальному кеші реєстру Claude за шляхом `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="Джерела Marketplace">
    - назва відомого Claude marketplace з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь marketplace або шлях `marketplace.json`
    - скорочення репозиторію GitHub, як-от `owner/repo`
    - URL репозиторію GitHub, як-от `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Правила віддаленого marketplace">
    Для віддалених marketplace, завантажених із GitHub або git, записи Plugin мають залишатися всередині клонованого репозиторію marketplace. OpenClaw приймає джерела з відносними шляхами з цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші не-path джерела Plugin з віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні Plugin OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex пакети (`.codex-plugin/plugin.json`)
- сумісні з Claude пакети (`.claude-plugin/plugin.json` або стандартне компонування компонентів Claude)
- сумісні з Cursor пакети (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети встановлюються у звичайний корінь Plugin і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються Skills пакетів, command-skills Claude, стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` / оголошені маніфестом `lspServers`, command-skills Cursor і сумісні каталоги хуків Codex; інші виявлені можливості пакетів показуються в діагностиці/info, але ще не підключені до виконання в runtime.
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
  Показувати лише ввімкнені Plugin.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Перемкнутися з табличного подання на деталізовані рядки для кожного Plugin з метаданими source/origin/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний інвентар разом із діагностикою реєстру та станом встановлення залежностей пакета.
</ParamField>

<Note>
`plugins list` спершу читає збережений локальний реєстр Plugin, із резервним варіантом, похідним лише від маніфесту, коли реєстр відсутній або недійсний. Це корисно для перевірки, чи встановлено Plugin, чи він увімкнений і видимий для планування холодного запуску, але це не live runtime перевірка вже запущеного процесу Gateway. Після зміни коду Plugin, стану ввімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати виконання нового коду `register(api)` або хуків. Для віддалених/container розгортань перевірте, що перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

`plugins list --json` включає `dependencyStatus` кожного Plugin з `package.json`
`dependencies` і `optionalDependencies`. OpenClaw перевіряє, чи ці назви пакетів
присутні вздовж звичайного шляху пошуку Node `node_modules` для Plugin; він
не імпортує runtime-код Plugin, не запускає менеджер пакетів і не виправляє
відсутні залежності.
</Note>

`plugins search` — це віддалений пошук у каталозі ClawHub. Він не перевіряє локальний
стан, не змінює config, не встановлює пакети й не завантажує runtime-код Plugin. Результати
пошуку містять назву пакета ClawHub, family, channel, version, summary та
підказку встановлення, як-от `openclaw plugins install clawhub:<package>`.

Для роботи з вбудованим Plugin усередині упакованого образу Docker змонтуйте через bind-mount каталог
вихідного коду Plugin поверх відповідного упакованого шляху вихідного коду, як-от
`/app/extensions/synology-chat`. OpenClaw виявить цей змонтований source
overlay перед `/app/dist/extensions/synology-chat`; звичайний скопійований каталог
вихідного коду залишається інертним, тому звичайні упаковані встановлення й далі використовують скомпільований dist.

Для налагодження runtime-хуків:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані хуки та діагностику з проходу інспекції із завантаженим модулем. Runtime-інспекція ніколи не встановлює залежності; використовуйте `openclaw doctor --fix`, щоб очистити застарілий стан залежностей або відновити відсутні завантажувані Plugin, на які посилається config.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки service/process, шлях config і справність RPC.
- Невбудовані хуки розмови (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, оскільки пов’язані встановлення повторно використовують шлях вихідного коду замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти вирішений точний spec (`name@version`) у керованому індексі Plugin, зберігаючи стандартну поведінку незакріпленою.
</Note>

### Індекс Plugin

Метадані встановлення Plugin — це стан, керований машиною, а не користувацький config. Встановлення й оновлення записують його в `plugins/installs.json` в активному каталозі стану OpenClaw. Його top-level мапа `installRecords` є довговічним джерелом метаданих встановлення, включно із записами для зламаних або відсутніх маніфестів Plugin. Масив `plugins` — це похідний від маніфестів кеш холодного реєстру. Файл містить попередження не редагувати його й використовується `openclaw plugins update`, uninstall, діагностикою та холодним реєстром Plugin.

Коли OpenClaw бачить доставлені застарілі записи `plugins.installs` у config, runtime-читання трактують їх як вхідні дані сумісності без перезапису `openclaw.json`. Явні записи Plugin і `openclaw doctor --fix` переносять ці записи в індекс Plugin і видаляють ключ config, коли записи config дозволені; якщо будь-який із записів не вдається, записи config зберігаються, щоб метадані встановлення не було втрачено.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи Plugin з `plugins.entries`, збереженого індексу Plugin, записів allow/deny list Plugin і пов’язаних записів `plugins.load.paths`, коли це застосовно. Якщо `--keep-files` не задано, uninstall також видаляє відстежуваний керований каталог встановлення, коли він розташований усередині кореня розширень Plugin OpenClaw. Для Plugin active memory слот пам’яті скидається до `memory-core`.

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

Оновлення застосовуються до відстежуваних встановлень Plugin у керованому індексі Plugin і відстежуваних встановлень hook-pack у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Визначення id Plugin порівняно з npm spec">
    Коли ви передаєте id Plugin, OpenClaw повторно використовує записаний install spec для цього Plugin. Це означає, що раніше збережені dist-tags, як-от `@beta`, і точні закріплені версії й далі використовуються під час подальших запусків `update <id>`.

    Для npm-встановлень також можна передати явний npm package spec з dist-tag або точною версією. OpenClaw зіставляє цю назву пакета з відстежуваним записом Plugin, оновлює цей встановлений Plugin і записує новий npm spec для майбутніх оновлень за id.

    Передавання назви npm-пакета без версії або тегу також зіставляється з відстежуваним записом Plugin. Використовуйте це, коли Plugin було закріплено на точній версії, і ви хочете повернути його до стандартної лінії релізів реєстру.

  </Accordion>
  <Accordion title="Оновлення beta-каналу">
    `openclaw plugins update` повторно використовує відстежуваний spec Plugin, якщо ви не передаєте новий spec. `openclaw update` додатково знає активний канал оновлень OpenClaw: на beta-каналі npm і ClawHub записи Plugin стандартної лінії спершу пробують `@beta`, а потім повертаються до записаного default/latest spec, якщо beta-релізу Plugin не існує. Точні версії та явні теги залишаються закріпленими за цим селектором.

  </Accordion>
  <Accordion title="Перевірки версії та дрейф цілісності">
    Перед live npm-оновленням OpenClaw перевіряє встановлену версію пакета за метаданими npm registry. Якщо встановлена версія та записана ідентичність артефакту вже збігаються з вирішеною ціллю, оновлення пропускається без завантаження, перевстановлення або перезапису `openclaw.json`.

    Коли збережений integrity hash існує, а hash отриманого артефакту змінюється, OpenClaw трактує це як дрейф npm artifact. Інтерактивна команда `openclaw plugins update` друкує очікувані та фактичні hashes і просить підтвердження перед продовженням. Неінтерактивні помічники оновлення fail closed, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час update">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як break-glass override для false positives вбудованого dangerous-code scan під час оновлень Plugin. Він усе ще не обходить блокування політики `before_install` Plugin або блокування через scan-failure і застосовується лише до оновлень Plugin, а не до оновлень hook-pack.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect показує identity, load status, source, можливості маніфесту, policy flags, diagnostics, install metadata, можливості пакета та будь-яку виявлену підтримку MCP або LSP server без імпорту runtime Plugin за замовчуванням. Додайте `--runtime`, щоб завантажити модуль Plugin і включити зареєстровані hooks, tools, commands, services, gateway methods і HTTP routes. Runtime-інспекція повідомляє про відсутні залежності Plugin напряму; встановлення та ремонти залишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

CLI-команди, що належать Plugin, зазвичай встановлюються як кореневі групи команд `openclaw`, але Plugin також можуть реєструвати вкладені команди під core parent, як-от `openclaw nodes`. Після того як `inspect --runtime` покаже команду в `cliCommands`, запустіть її за вказаним шляхом; наприклад, Plugin, який реєструє `demo-git`, можна перевірити за допомогою `openclaw demo-git ping`.

Кожен Plugin класифікується за тим, що він фактично реєструє під час runtime:

- **plain-capability** — один тип можливості (наприклад, plugin лише провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/сервіси, але без можливостей

Докладніше про модель можливостей див. у [формах Plugin](/uk/plugins/architecture#plugin-shapes).

<Note>
Прапорець `--json` виводить машинозчитуваний звіт, придатний для сценаріїв і аудиту. `inspect --all` відображає таблицю для всього парку з формою, типами можливостей, повідомленнями про сумісність, можливостями bundle та стовпцями з підсумком хуків. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження plugin, діагностику manifest/discovery та повідомлення про сумісність. Коли все чисто, він друкує `No plugin issues detected.`

Якщо налаштований plugin є на диску, але заблокований перевірками безпечності шляхів у завантажувачі, валідація конфігурації зберігає запис plugin і повідомляє про нього як `present but blocked`. Виправте попередню діагностику заблокованого plugin, наприклад володіння шляхом або дозволи на запис для всіх, замість видалення конфігурації `plugins.entries.<id>` або `plugins.allow`.

Для збоїв форми модуля, як-от відсутні експорти `register`/`activate`, повторіть запуск із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб додати до діагностичного виводу стислий підсумок форми експортів.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр plugin — це збережена в OpenClaw модель холодного читання для ідентичності встановлених plugin, стану ввімкнення, метаданих джерела та володіння внесками. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу та інвентаризація plugin можуть читати його без імпорту модулів runtime plugin.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр наявний, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу plugin, політики конфігурації та метаданих manifest/package. Це шлях ремонту, а не шлях активації runtime.

`openclaw doctor --fix` також виправляє пов’язане з реєстром відхилення керованих npm: якщо осиротілий або відновлений пакет `@openclaw/*` у корені npm керованих plugin затіняє bundled plugin, doctor видаляє цей застарілий пакет і перебудовує реєстр, щоб запуск перевірявся за bundled manifest.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Віддавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний варіант через env призначений лише для аварійного відновлення запуску під час розгортання міграції.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список Marketplace приймає локальний шлях marketplace, шлях `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` друкує розпізнану мітку джерела, а також розібраний marketplace manifest і записи plugin.

## Пов’язане

- [Створення plugin](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Спільнотні plugin](/uk/plugins/community)
